import type { TUniObject } from "../../types/common.type"

const StatusCart = ({data}: {data:TUniObject<{}>}) => {
  return (
    <div className="flex justify-between drop-shadow-md bg-white rounded-lg p-4">
        <div>
          <h3 className="text-lg font-semibold">{data.category}</h3>
          <p className="text-sm text-gray-500">{data.total} patients</p>
        </div>
        <img src={data.imageUrl} alt={data.category} className="w-12 h-12 mr-4" />
    </div>
  )
}

export default StatusCart